import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AppComponent} from "../../app.component";
import {GlobalProviderService} from "../../services/global-provider.service";
import {SocketIOService} from "../../services/socket-io.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-waiting-room',
  templateUrl: './waiting-room.component.html',
  styleUrls: ['./waiting-room.component.css']
})
export class WaitingRoomComponent implements OnInit, AfterViewInit {

  appComponent: AppComponent = GlobalProviderService.appComponent;
  isWaitingForServerResponse: boolean = true;
  hasCompletedPayment: boolean = false;
  paymentAmount: number = 0;
  paymentCurrency: string = "MATIC";
  userAddress: string = ""; // TODO: Replace this address...
  playersInGame: string[] = [];
  inviteLink: string = window.location.href;
  copyButtonText: string = "Copy Invite Link";

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef) {
    SocketIOService.setActionForEvent('newPlayerJoinedRoom', (playerAddresses: string[]) => {
      console.log("Got response");
      this.playersInGame = playerAddresses;
      this.hasCompletedPayment = true;
      this.isWaitingForServerResponse = false;
      this.changeDetectorRef.detectChanges();
    });
    SocketIOService.setActionForEvent('addPlayerPaymentNotComplete', () => {
      this.isWaitingForServerResponse = false;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.sendInitialJoinRequestToServer();
  }

  sendInitialJoinRequestToServer = () => {
    if (this.userAddress) {
      let sendData = {
        "playerAddress": this.userAddress,
        "roomId": this.activatedRoute.snapshot.paramMap.get("roomId")
      };
      console.log(sendData);
      SocketIOService.emitEventToServer('addPlayerToRoom', sendData);
    }
  };

  onCopyInviteLinkClick = () => {
    navigator.clipboard.writeText(this.inviteLink).then(() => {
      this.updateCopyButton("Copied!!");
    }).catch((err) => {
      this.updateCopyButton("Copy Error");
      console.log(err);
    });
  };

  updateCopyButton = (newText: string) => {
    this.copyButtonText = newText;
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.copyButtonText = "Copy Invite Link";
      this.changeDetectorRef.detectChanges();
    }, 1250);
  };

  onPayButtonClick = () => {
    // TODO: Complete this...
    if (this.userAddress) {
      // Create Payment Transaction...
    } else {
      // Connect Wallet
    }
  };

  onClickCancel = () => {
    this.router.navigate(["/home"]).then().catch((err) => {
      console.log("Unable to route to home.");
      console.log(err);
    });
  };

}
